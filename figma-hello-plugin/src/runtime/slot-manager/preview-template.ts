const PREVIEW_CANVAS_KEY = 'preview:canvas';
const PREVIEW_SUMMARY_LIST_KEY = 'preview:summary:list';
const PREVIEW_WARNINGS_LIST_KEY = 'preview:warnings:list';
const PREVIEW_SUBTITLE_KEY = 'preview:subtitle';
const PREVIEW_TIMESTAMP_KEY = 'preview:timestamp';
const PREVIEW_TITLE_KEY = 'preview:title';

const INTER_REGULAR: FontName = { family: 'Inter', style: 'Regular' };
const INTER_BOLD: FontName = { family: 'Inter', style: 'Bold' };

const WHITE_FILL: Paint = {
  type: 'SOLID',
  color: { r: 0.9725490196, g: 0.9764705882, b: 0.9843137255 },
};

const BODY_TEXT_COLOR: Paint = {
  type: 'SOLID',
  color: { r: 0.1607843137, g: 0.1705882353, b: 0.2156862745 },
};

const MUTED_TEXT_COLOR: Paint = {
  type: 'SOLID',
  color: { r: 0.4196078431, g: 0.4470588235, b: 0.5019607843 },
};

const WARNING_TEXT_COLOR: Paint = {
  type: 'SOLID',
  color: { r: 0.7607843137, g: 0.3843137255, b: 0.0862745098 },
};

const PREVIEW_FRAME_FILL: Paint = {
  type: 'SOLID',
  color: { r: 0.9529411765, g: 0.9568627451, b: 0.9647058824 },
};

const PREVIEW_CANVAS_FILL: Paint = {
  type: 'SOLID',
  color: { r: 0.9882352941, g: 0.9490196078, b: 0.9725490196 },
};

const SUMMARY_FILL: Paint = {
  type: 'SOLID',
  color: { r: 0.9960784314, g: 0.9764705882, b: 0.7647058824 },
};

const BANNER_FILL: Paint = {
  type: 'SOLID',
  color: { r: 0.0431372549, g: 0.0588235294, b: 0.1019607843 },
};

const SUMMARY_ROW_FILL: Paint = {
  type: 'SOLID',
  color: { r: 1, g: 0.9921568627, b: 0.8470588235 },
};

const PREVIEW_LOCK_KEY = 'preview:template:ready';

interface PreviewTemplate {
  canvas: FrameNode | null;
  summaryList: FrameNode | null;
  warningsList: FrameNode | null;
  subtitle: TextNode | null;
  timestamp: TextNode | null;
  title: TextNode | null;
}

interface PreviewSummaryPayload {
  timestamp: number;
  sectionLabel: string;
  slotId?: string | null;
  pageName?: string;
  frameName?: string;
  createdCount: number;
  warningMessages: string[];
  errorMessages: string[];
}

const loadFonts = async () => {
  await figma.loadFontAsync(INTER_REGULAR);
  await figma.loadFontAsync(INTER_BOLD);
};

const setText = (
  node: TextNode,
  value: string,
  options?: { bold?: boolean; size?: number; fill?: Paint },
) => {
  node.fontName = options?.bold ? INTER_BOLD : INTER_REGULAR;
  if (options?.size) {
    node.fontSize = options.size;
  }
  if (options?.fill) {
    node.fills = [options.fill];
  } else {
    node.fills = [BODY_TEXT_COLOR];
  }
  node.characters = value;
};

const ensureFrameLayout = (frame: FrameNode, layout: 'VERTICAL' | 'HORIZONTAL') => {
  frame.layoutMode = layout;
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  frame.itemSpacing = 24;
  frame.paddingTop = 40;
  frame.paddingRight = 40;
  frame.paddingBottom = 40;
  frame.paddingLeft = 40;
  frame.cornerRadius = 24;
  frame.fills = [PREVIEW_FRAME_FILL];
};

const getNodeById = <T extends SceneNode>(frame: FrameNode, key: string): T | null => {
  const id = frame.getPluginData(key);
  if (!id) return null;
  const node = figma.getNodeById(id);
  if (node && (node as any).removed !== true) {
    return node as T;
  }
  return null;
};

const setNodePluginData = (frame: FrameNode, key: string, node: SceneNode) => {
  frame.setPluginData(key, node.id);
};

const createTextNode = (name: string): TextNode => {
  const text = figma.createText();
  text.name = name;
  text.characters = '';
  return text;
};

const createSummaryRow = (label: string, value: string): FrameNode => {
  const row = figma.createFrame();
  row.name = 'Preview:SummaryRow';
  row.layoutMode = 'VERTICAL';
  row.primaryAxisSizingMode = 'AUTO';
  row.counterAxisSizingMode = 'AUTO';
  row.itemSpacing = 4;
  row.paddingTop = 10;
  row.paddingRight = 12;
  row.paddingBottom = 10;
  row.paddingLeft = 12;
  row.cornerRadius = 12;
  row.fills = [SUMMARY_ROW_FILL];

  const labelNode = createTextNode('Preview:SummaryLabel');
  const valueNode = createTextNode('Preview:SummaryValue');

  row.appendChild(labelNode);
  row.appendChild(valueNode);

  setText(labelNode, label, { bold: true, size: 12, fill: MUTED_TEXT_COLOR });
  setText(valueNode, value, { size: 14 });

  return row;
};

const ensurePreviewTemplateInternal = async (frame: FrameNode) => {
  ensureFrameLayout(frame, 'VERTICAL');

  let banner = frame.findOne(
    (node) => node.type === 'FRAME' && node.name === 'Preview:Banner',
  ) as FrameNode | null;
  let body = frame.findOne(
    (node) => node.type === 'FRAME' && node.name === 'Preview:Body',
  ) as FrameNode | null;

  if (!banner) {
    banner = figma.createFrame();
    banner.name = 'Preview:Banner';
    banner.layoutMode = 'HORIZONTAL';
    banner.primaryAxisAlignItems = 'SPACE_BETWEEN';
    banner.counterAxisAlignItems = 'CENTER';
    banner.paddingTop = 20;
    banner.paddingRight = 24;
    banner.paddingBottom = 20;
    banner.paddingLeft = 24;
    banner.itemSpacing = 24;
    banner.cornerRadius = 18;
    banner.fills = [BANNER_FILL];
    frame.appendChild(banner);
  }

  if (!body) {
    body = figma.createFrame();
    body.name = 'Preview:Body';
    body.layoutMode = 'HORIZONTAL';
    body.primaryAxisSizingMode = 'AUTO';
    body.counterAxisSizingMode = 'AUTO';
    body.itemSpacing = 24;
    body.padding = 0 as any;
    body.counterAxisAlignItems = 'STRETCH';
    body.fills = [];
    frame.appendChild(body);
  }

  let title = getNodeById<TextNode>(frame, PREVIEW_TITLE_KEY);
  let subtitle = getNodeById<TextNode>(frame, PREVIEW_SUBTITLE_KEY);
  let timestamp = getNodeById<TextNode>(frame, PREVIEW_TIMESTAMP_KEY);

  if (!title || title.removed) {
    title = createTextNode('Preview:Title');
    banner.appendChild(title);
    setNodePluginData(frame, PREVIEW_TITLE_KEY, title);
  }

  if (!subtitle || subtitle.removed) {
    subtitle = createTextNode('Preview:Subtitle');
    banner.appendChild(subtitle);
    setNodePluginData(frame, PREVIEW_SUBTITLE_KEY, subtitle);
  }

  if (!timestamp || timestamp.removed) {
    timestamp = createTextNode('Preview:Timestamp');
    banner.appendChild(timestamp);
    setNodePluginData(frame, PREVIEW_TIMESTAMP_KEY, timestamp);
  }

  let canvas = getNodeById<FrameNode>(frame, PREVIEW_CANVAS_KEY);
  let summary = getNodeById<FrameNode>(frame, PREVIEW_SUMMARY_LIST_KEY)?.parent as FrameNode | null;
  let summaryList = getNodeById<FrameNode>(frame, PREVIEW_SUMMARY_LIST_KEY);
  let warningsList = getNodeById<FrameNode>(frame, PREVIEW_WARNINGS_LIST_KEY);

  if (!canvas || canvas.removed) {
    canvas = figma.createFrame();
    canvas.name = 'Preview:Canvas';
    canvas.layoutMode = 'VERTICAL';
    canvas.primaryAxisSizingMode = 'AUTO';
    canvas.counterAxisSizingMode = 'AUTO';
    canvas.itemSpacing = 16;
    canvas.paddingTop = 24;
    canvas.paddingRight = 24;
    canvas.paddingBottom = 24;
    canvas.paddingLeft = 24;
    canvas.cornerRadius = 18;
    canvas.fills = [PREVIEW_CANVAS_FILL];
    canvas.layoutGrow = 1;
    body.appendChild(canvas);
    setNodePluginData(frame, PREVIEW_CANVAS_KEY, canvas);
  }

  if (!summary || summary.removed) {
    summary = figma.createFrame();
    summary.name = 'Preview:SummaryPanel';
    summary.layoutMode = 'VERTICAL';
    summary.primaryAxisSizingMode = 'AUTO';
    summary.counterAxisSizingMode = 'AUTO';
    summary.itemSpacing = 16;
    summary.paddingTop = 24;
    summary.paddingRight = 24;
    summary.paddingBottom = 24;
    summary.paddingLeft = 24;
    summary.cornerRadius = 18;
    summary.fills = [SUMMARY_FILL];
    summary.resizeWithoutConstraints(480, 400);
    body.appendChild(summary);
  }

  if (!summaryList || summaryList.removed) {
    summaryList = figma.createFrame();
    summaryList.name = 'Preview:SummaryList';
    summaryList.layoutMode = 'VERTICAL';
    summaryList.primaryAxisSizingMode = 'AUTO';
    summaryList.counterAxisSizingMode = 'AUTO';
    summaryList.itemSpacing = 12;
    summary.appendChild(summaryList);
    setNodePluginData(frame, PREVIEW_SUMMARY_LIST_KEY, summaryList);
  }

  if (!warningsList || warningsList.removed) {
    const warningsWrapper = figma.createFrame();
    warningsWrapper.name = 'Preview:WarningsWrapper';
    warningsWrapper.layoutMode = 'VERTICAL';
    warningsWrapper.primaryAxisSizingMode = 'AUTO';
    warningsWrapper.counterAxisSizingMode = 'AUTO';
    warningsWrapper.itemSpacing = 8;
    warningsWrapper.fills = [];
    summary.appendChild(warningsWrapper);

    warningsList = figma.createFrame();
    warningsList.name = 'Preview:WarningsList';
    warningsList.layoutMode = 'VERTICAL';
    warningsList.primaryAxisSizingMode = 'AUTO';
    warningsList.counterAxisSizingMode = 'AUTO';
    warningsList.itemSpacing = 8;
    warningsList.fills = [];
    warningsWrapper.appendChild(warningsList);
    setNodePluginData(frame, PREVIEW_WARNINGS_LIST_KEY, warningsList);
  }

  frame.setPluginData(PREVIEW_LOCK_KEY, 'true');

  await loadFonts();

  setText(title, 'DRY-RUN PREVIEW', { bold: true, size: 18, fill: WHITE_FILL });
  setText(subtitle, '선택한 섹션이 여기에 요약됩니다.', { size: 14, fill: WHITE_FILL });
  setText(timestamp, '-', { size: 12, fill: WHITE_FILL });

  return {
    canvas,
    summaryList,
    warningsList,
    subtitle,
    timestamp,
    title,
  } satisfies PreviewTemplate;
};

export const ensurePreviewTemplate = async (frame: FrameNode, intent?: 'dry-run' | 'apply') => {
  const isPreview = intent === 'dry-run' || frame.name.endsWith('_preview');
  if (!isPreview) {
    frame.setPluginData(PREVIEW_LOCK_KEY, 'false');
    return null;
  }
  return ensurePreviewTemplateInternal(frame);
};

export const getPreviewCanvas = (frame: FrameNode): FrameNode | null => {
  if (frame.getPluginData(PREVIEW_LOCK_KEY) !== 'true') {
    return null;
  }
  return getNodeById<FrameNode>(frame, PREVIEW_CANVAS_KEY);
};

const clearChildren = (parent: FrameNode) => {
  [...parent.children].forEach((child) => child.remove());
};

export const updatePreviewSummary = async (frame: FrameNode, payload: PreviewSummaryPayload) => {
  if (frame.getPluginData(PREVIEW_LOCK_KEY) !== 'true') {
    return;
  }

  await loadFonts();

  const summaryList = getNodeById<FrameNode>(frame, PREVIEW_SUMMARY_LIST_KEY);
  const warningsList = getNodeById<FrameNode>(frame, PREVIEW_WARNINGS_LIST_KEY);
  const subtitle = getNodeById<TextNode>(frame, PREVIEW_SUBTITLE_KEY);
  const timestamp = getNodeById<TextNode>(frame, PREVIEW_TIMESTAMP_KEY);
  const title = getNodeById<TextNode>(frame, PREVIEW_TITLE_KEY);

  if (!summaryList || !warningsList || !subtitle || !timestamp || !title) {
    return;
  }

  setText(title, 'DRY-RUN PREVIEW', { bold: true, size: 18, fill: WHITE_FILL });

  const sectionLabel = payload.sectionLabel || '선택한 섹션';
  const slotInfo = payload.slotId ? ` · Slot ${payload.slotId}` : '';
  setText(subtitle, `${sectionLabel}${slotInfo}`, { size: 14, fill: WHITE_FILL });

  const timestampText = new Date(payload.timestamp).toLocaleString('ko-KR');
  setText(timestamp, timestampText, { size: 12, fill: WHITE_FILL });

  clearChildren(summaryList);
  const rows = [
    createSummaryRow('대상 페이지', payload.pageName ?? '—'),
    createSummaryRow('프레임 이름', payload.frameName ?? '—'),
    createSummaryRow('선택 섹션', sectionLabel),
    createSummaryRow('생성 노드 수', String(payload.createdCount)),
    createSummaryRow('경고 수', String(payload.warningMessages.length)),
    createSummaryRow('오류 수', String(payload.errorMessages.length)),
  ];

  rows.forEach((row) => summaryList.appendChild(row));

  clearChildren(warningsList);

  if (payload.warningMessages.length === 0 && payload.errorMessages.length === 0) {
    const notice = createTextNode('Preview:WarningsEmpty');
    setText(notice, '경고나 오류가 없습니다.', { size: 13, fill: BODY_TEXT_COLOR });
    warningsList.appendChild(notice);
    return;
  }

  payload.warningMessages.forEach((message) => {
    const warning = createTextNode('Preview:Warning');
    setText(warning, `⚠ ${message}`, { size: 13, fill: WARNING_TEXT_COLOR });
    warningsList.appendChild(warning);
  });

  payload.errorMessages.forEach((message) => {
    const error = createTextNode('Preview:Error');
    setText(error, `🛑 ${message}`, { size: 13, fill: WARNING_TEXT_COLOR });
    warningsList.appendChild(error);
  });
};

export const getPreviewTemplateNodes = (frame: FrameNode): PreviewTemplate => ({
  canvas: getPreviewCanvas(frame),
  summaryList: getNodeById<FrameNode>(frame, PREVIEW_SUMMARY_LIST_KEY),
  warningsList: getNodeById<FrameNode>(frame, PREVIEW_WARNINGS_LIST_KEY),
  subtitle: getNodeById<TextNode>(frame, PREVIEW_SUBTITLE_KEY),
  timestamp: getNodeById<TextNode>(frame, PREVIEW_TIMESTAMP_KEY),
  title: getNodeById<TextNode>(frame, PREVIEW_TITLE_KEY),
});
