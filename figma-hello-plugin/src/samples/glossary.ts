import { SchemaDocument } from '../schema';

export const glossaryLayoutSample: SchemaDocument = {
  schemaVersion: '1.0.0',
  meta: {
    title: 'Glossary Dual Pane Layout',
    description: '본 문서와 보조 문서를 나란히 배치하는 2분할 레이아웃',
    createdBy: 'codex',
    tokenset: 'gg_real/base',
  },
  target: {
    page: 'GG_real_admin',
    frameName: 'GlossaryLayout',
    mode: 'replace',
  },
  nodes: [
    {
      type: 'frame',
      name: 'GlossaryLayout',
      size: { width: 1440, height: 900 },
      tokens: {
        fill: 'color.surface.base',
      },
      layout: {
        type: 'auto',
        direction: 'HORIZONTAL',
        primaryAlign: 'START',
        counterAlign: 'STRETCH',
        spacing: 24,
        padding: { top: 32, right: 32, bottom: 32, left: 32 },
      },
      children: [
        {
          type: 'stack',
          name: 'PrimaryColumn',
          size: { width: 880 },
          tokens: {
            fill: 'color.surface.card',
            radius: 'radius.lg',
          },
          layout: {
            type: 'auto',
            direction: 'VERTICAL',
            spacing: 18,
            padding: { top: 28, right: 32, bottom: 28, left: 32 },
          },
          children: [
            {
              type: 'text',
              name: 'Heading',
              text: {
                content: '용어 상세',
                style: { token: 'typo.heading.lg' },
              },
            },
            {
              type: 'text',
              name: 'Body',
              tokens: { text: 'color.text.secondary' },
              text: {
                content:
                  '여기에 본문 텍스트가 들어갑니다. JSON 스키마를 확장하면 자동으로 여러 컴포넌트를 생성할 수 있습니다.',
                style: { token: 'typo.body.md' },
              },
            },
          ],
        },
        {
          type: 'stack',
          name: 'SecondaryColumn',
          size: { width: 432 },
          tokens: {
            fill: 'color.surface.card',
            radius: 'radius.lg',
          },
          layout: {
            type: 'auto',
            direction: 'VERTICAL',
            spacing: 16,
            padding: { top: 24, right: 24, bottom: 24, left: 24 },
          },
          children: [
            {
              type: 'text',
              name: 'RelatedTitle',
              text: {
                content: '관련 용어',
                style: { token: 'typo.heading.lg' },
              },
            },
            {
              type: 'stack',
              name: 'RelatedList',
              layout: {
                type: 'auto',
                direction: 'VERTICAL',
                spacing: 12,
              },
              children: [
                {
                  type: 'text',
                  name: 'RelatedItem1',
                  text: {
                    content: '· 접힘/펼침 인터랙션',
                    style: { token: 'typo.body.md' },
                  },
                },
                {
                  type: 'text',
                  name: 'RelatedItem2',
                  text: {
                    content: '· 북마크 & 하이라이트',
                    style: { token: 'typo.body.md' },
                  },
                },
                {
                  type: 'text',
                  name: 'RelatedItem3',
                  text: {
                    content: '· 백링크 미리 보기',
                    style: { token: 'typo.body.md' },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
