"use client";

import { useRef, useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import {
  FluentProvider,
  RendererProvider,
  SSRProvider,
  createDOMRenderer,
  renderToStyleElements,
  webLightTheme,
} from "@fluentui/react-components";
import { FiltersProvider } from "@/components/filters-provider";

/**
 * Fluent UI v9 + Next.js App Router.
 * Griffel (Fluent's CSS-in-JS) collects styles during the server render and we
 * flush them into <head> once, so the first paint is already styled.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [renderer] = useState(() => createDOMRenderer());
  const flushed = useRef(false);

  useServerInsertedHTML(() => {
    if (flushed.current) return null;
    flushed.current = true;
    return <>{renderToStyleElements(renderer)}</>;
  });

  return (
    <RendererProvider renderer={renderer}>
      <SSRProvider>
        {/* No layout classes on FluentProvider: Fluent copies its classes onto portal
            containers (tooltips, drawers), which would then cover the page. */}
        <FluentProvider theme={webLightTheme}>
          <FiltersProvider>
            <div className="flex min-h-dvh flex-col bg-[var(--colorNeutralBackground3)]">{children}</div>
          </FiltersProvider>
        </FluentProvider>
      </SSRProvider>
    </RendererProvider>
  );
}
