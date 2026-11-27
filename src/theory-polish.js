/* Keep Italian target phrases clean and restart each subtopic at its beginning. */
const theoryRoot = document.querySelector("#theory-description");
const theoryScroller = document.querySelector("#screen-theory .theory-slide-content");

function normalizeTheoryText(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  for (const node of textNodes) {
    const value = node.nodeValue;
    node.nodeValue = value
      .replace(/«(?=<em|<span class="theory-target-word")|(?<=<\/em>)»/g, "")
      .replace(/<([\p{L}][^<>\n]{0,90})>/gu, "$1");
  }
  root.querySelectorAll("em, .theory-target-word").forEach(el => {
    if (el.closest("table")) el.style.fontStyle = "normal";
    else el.style.fontStyle = "italic";
  });
}

if (theoryRoot) {
  const observer = new MutationObserver(() => {
    normalizeTheoryText(theoryRoot);
    if (theoryScroller) theoryScroller.scrollTop = 0;
  });
  observer.observe(theoryRoot, { childList: true, subtree: true, characterData: true });
  normalizeTheoryText(theoryRoot);
}
document.querySelectorAll("#theory-prev, #theory-next").forEach(button => {
  button.addEventListener("click", () => {
    requestAnimationFrame(() => {
      if (theoryScroller) theoryScroller.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  });
});
