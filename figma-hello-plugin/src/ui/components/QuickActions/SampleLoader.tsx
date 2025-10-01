interface SampleLoaderProps {
  readonly onLoadSample: () => void;
}

export const SampleLoader = ({ onLoadSample }: SampleLoaderProps) => (
  <button class="quick-actions__button" type="button" onClick={onLoadSample}>
    현재 페이지 샘플 불러오기
  </button>
);
