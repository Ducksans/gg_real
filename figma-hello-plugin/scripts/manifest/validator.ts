// doc_refs: ["admin/plan/figmapluginmake.md"]

import Ajv, { type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

import type { SectionFileRaw, SurfaceFileRaw } from './types';

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
addFormats(ajv);

const boxSpacingSchema = {
  type: 'object',
  properties: {
    top: { type: 'number' },
    right: { type: 'number' },
    bottom: { type: 'number' },
    left: { type: 'number' },
  },
  additionalProperties: false,
};

const slotSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', minLength: 1 },
    label: { type: 'string' },
    parent: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    layout: { enum: ['VERTICAL', 'HORIZONTAL'] },
    spacing: { type: 'number' },
    padding: { anyOf: [{ type: 'null' }, boxSpacingSchema] },
    width: {
      anyOf: [{ type: 'number' }, { type: 'string', enum: ['hug', 'fill'] }],
    },
    height: {
      anyOf: [{ type: 'number' }, { type: 'string', enum: ['hug'] }],
    },
    grow: { type: 'number' },
    allowedSections: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  additionalProperties: true,
};

const surfaceSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', minLength: 1 },
    label: { type: 'string' },
    layout: {
      anyOf: [
        {
          type: 'object',
          properties: {
            width: { type: 'number' },
            height: { anyOf: [{ type: 'number' }, { type: 'null' }] },
            padding: { anyOf: [{ type: 'null' }, boxSpacingSchema] },
            spacing: { type: 'number' },
            background: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          },
          additionalProperties: false,
        },
        { type: 'null' },
      ],
    },
    slots: {
      type: 'array',
      items: slotSchema,
    },
    routes: { type: 'object' },
    requiredSlots: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  additionalProperties: true,
};

const sectionSchema = {
  type: 'object',
  properties: {
    meta: {
      type: 'object',
      properties: {
        order: { type: 'number' },
        section: { type: 'string' },
        label: { type: 'string' },
        description: { type: 'string' },
        designSurface: { type: 'string' },
        designSurfaceLabel: { type: 'string' },
        route: { type: 'string' },
        routeLabel: { type: 'string' },
        slot: { type: 'string' },
        slotLabel: { type: 'string' },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

const surfaceValidator = ajv.compile<SurfaceFileRaw>(surfaceSchema);
const sectionValidator = ajv.compile<SectionFileRaw>(sectionSchema);

const formatErrors = (errors: ErrorObject[] | null | undefined) =>
  (errors ?? [])
    .map((error) => `${error.instancePath || '(root)'} ${error.message ?? ''}`.trim())
    .join('; ');

export const validateSurfaceFile = (data: unknown, filePath: string): SurfaceFileRaw => {
  if (!surfaceValidator(data)) {
    throw new Error(
      `Surface 스키마 검증 실패: ${filePath} — ${formatErrors(surfaceValidator.errors)}`,
    );
  }
  return data as SurfaceFileRaw;
};

export const validateSectionFile = (data: unknown, filePath: string): SectionFileRaw => {
  if (!sectionValidator(data)) {
    throw new Error(
      `Section 스키마 검증 실패: ${filePath} — ${formatErrors(sectionValidator.errors)}`,
    );
  }
  return data as SectionFileRaw;
};
