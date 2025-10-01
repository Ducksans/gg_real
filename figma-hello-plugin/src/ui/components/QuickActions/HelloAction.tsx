interface HelloActionProps {
  readonly onCreateHello: () => void;
}

export const HelloAction = ({ onCreateHello }: HelloActionProps) => (
  <button class="quick-actions__button" type="button" onClick={onCreateHello}>
    Hello 프레임 생성
  </button>
);
