import { lazy, Suspense } from "react";

const ReactQueryDevtools = lazy(() =>
  import("@tanstack/react-query-devtools").then((mod) => ({
    default: mod.ReactQueryDevtools,
  })),
);

interface DevToolsProps {
  show: boolean;
}

export const DevTools: React.FC<DevToolsProps> = ({ show }) => {
  if (!show) return null;

  return (
    <Suspense fallback={null}>
      <ReactQueryDevtools initialIsOpen={false} />
    </Suspense>
  );
};
