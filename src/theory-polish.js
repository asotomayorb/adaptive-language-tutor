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
    const normalized = value.replace(/<([\p{L}][^<>\n]{0,90})>/gu, "$1");
    if (normalized !== value) node.nodeValue = normalized;
  }
  root.querySelectorAll("em, .theory-target-word").forEach(el => {
    const previous = el.previousSibling;
    const next = el.nextSibling;
    if (previous?.nodeType === Node.TEXT_NODE && previous.nodeValue.endsWith("«")) previous.nodeValue = previous.nodeValue.slice(0, -1);
    if (next?.nodeType === Node.TEXT_NODE && next.nodeValue.startsWith("»")) next.nodeValue = next.nodeValue.slice(1);
    if (el.closest("table")) el.style.fontStyle = "normal";
    else el.style.fontStyle = "italic";
    el.style.fontWeight = "750";
  });
  root.querySelectorAll(".theory-variant-separator").forEach(el => {
    const normalized = el.textContent.replace(/\/\s*\/+/g, " / ").replace(/\/+/g, "/");
    if (normalized !== el.textContent) el.textContent = normalized;
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
