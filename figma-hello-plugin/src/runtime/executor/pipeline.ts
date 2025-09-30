/**
 * Guardrails → SlotManager → Notifier 순서를 정의한다.
 */
export const runtimeExecutionPipeline = ['guardrails', 'slot-manager', 'notifier'] as const;
