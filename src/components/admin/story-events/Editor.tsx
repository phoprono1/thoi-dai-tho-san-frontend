import dynamic from "next/dynamic";
import React from "react";

const StoryEventEditorClient = dynamic(
  () => import("./Editor.client").then((m) => m.default),
  { ssr: false }
);

type Props = {
  initialHtml?: string;
  onChange?: (html: string) => void;
};

export default function StoryEventEditor(props: Props) {
  return (
    <div>
      <StoryEventEditorClient {...props} />
    </div>
  );
}
