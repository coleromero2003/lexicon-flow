declare module "@react-pdf/renderer" {
  import type { ReactElement, ReactNode } from "react";

  export interface DocumentProps {
    author?: string;
    keywords?: string[];
    producer?: string;
    title?: string;
    subject?: string;
    creator?: string;
    language?: string;
    pageMode?: string;
    pageLayout?: string;
  }

  export interface PageProps {
    size?: string | number[];
    style?: Record<string, unknown> | Record<string, unknown>[];
    children?: ReactNode;
  }

  export interface TextProps {
    style?: Record<string, unknown> | Record<string, unknown>[];
    children?: ReactNode;
  }

  export interface ViewProps {
    style?: Record<string, unknown> | Record<string, unknown>[];
    children?: ReactNode;
    fixed?: boolean;
  }

  export const Document: (props: DocumentProps & { children?: ReactNode }) => ReactElement;
  export const Page: (props: PageProps) => ReactElement;
  export const Text: (props: TextProps) => ReactElement;
  export const View: (props: ViewProps) => ReactElement;

  export const StyleSheet: {
    create<T extends Record<string, unknown>>(styles: T): T;
  };

  export function renderToBuffer(
    element: ReactElement<DocumentProps>
  ): Promise<Uint8Array>;
}
