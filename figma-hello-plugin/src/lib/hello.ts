export async function createHelloFrame() {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

  const frame = figma.createFrame();
  frame.name = 'Hello Frame';
  frame.resize(240, 120);
  frame.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.95, b: 1 } }];
  frame.cornerRadius = 16;

  const text = figma.createText();
  text.fontName = { family: 'Inter', style: 'Regular' };
  text.fontSize = 24;
  text.characters = 'Hello World';
  text.fills = [{ type: 'SOLID', color: { r: 0.16, g: 0.2, b: 0.32 } }];
  text.x = 24;
  text.y = 40;

  frame.appendChild(text);
  figma.currentPage.appendChild(frame);
  figma.currentPage.selection = [frame];

  return frame;
}
