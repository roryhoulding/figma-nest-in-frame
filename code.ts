/* 
This works for most cases, but will not work when
a node is on top of a frame that does not have the same parent.

Only works if one node is selected.

If it overlaps with multiple frames, it will nest itself inside the first one it finds.

Future features:
- Nest in group
- Visual cue on completion (e.g. temporary red ring around new parent frame)
- Un-nest from frame
- Nest multiple nodes at once

Just learning Typescript so there are some bad things going on (I think)
*/

function main() {
  if (figma.currentPage.selection.length > 1) {
    figma.closePlugin('Too many nodes selected');
    return;
  }

  if (figma.currentPage.selection.length === 0) {
    figma.closePlugin('Nothing selected');
    return;
  }

  const selectedNode: SceneNode = figma.currentPage.selection[0];

  // A parent node is needed to find the sibling nodes later
  if (!selectedNode.parent) {
    figma.closePlugin('No parent node');
    return;
  }

  // Get the siblings of the selected node that are frames
  // Do not include the currently selected node

  const siblingFrames = selectedNode.parent.children.filter(
    (node) => node.type === 'FRAME' && selectedNode.id !== node.id
  );

  if (siblingFrames.length === 0) {
    figma.closePlugin('No sibling frames');
    return;
  }

  for (const frame of siblingFrames) {
    const selectedNodeIsInside = checkIsInside(selectedNode, frame);

    if (selectedNodeIsInside) {
      // a node's position is relative to its parent
      // this means the absolute position on the screen will change
      // when you append the node to a new parent
      // need calculate node position relative to the frame
      // it is about to be in
      const newX = selectedNode.x - frame.x;
      const newY = selectedNode.y - frame.y;

      // still learning typescript, not sure how to solve this error
      frame.appendChild(selectedNode);

      // set node position relative to the new parent frame
      // this ensures it doesn't move absolute position on the screen
      selectedNode.x = newX;
      selectedNode.y = newY;

      return;
    }
  }
}

// ----------------- Run plugin ----------------- //

main();
figma.closePlugin();

// ----------------- Helper functions ----------------- //

function calcNodeCenter(node: SceneNode) {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  };
}

function calcNodeEdges(node: SceneNode) {
  return {
    left: node.x,
    right: node.x + node.width,
    top: node.y,
    bottom: node.y + node.height,
  };
}

// Checks if nodeA is inside nodeB (visually)
function checkIsInside(nodeA: SceneNode, nodeB: SceneNode) {
  const nodeACenter = calcNodeCenter(nodeA);
  const nodeBEdges = calcNodeEdges(nodeB);

  if (
    nodeACenter.x >= nodeBEdges.left &&
    nodeACenter.x <= nodeBEdges.right &&
    nodeACenter.y >= nodeBEdges.top &&
    nodeACenter.y <= nodeBEdges.bottom
  ) {
    return true;
  }

  return false;
}
