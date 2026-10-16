"use client";

import type { ComponentType } from "react";
import { TOOL_MAP } from "@/lib/tools";
import { ToolHeader } from "@/components/ui";
import { DiffTool } from "./DiffTool";
import { RegexTool } from "./RegexTool";
import { Base64Tool } from "./Base64Tool";
import { UrlTool } from "./UrlTool";
import { HtmlEntityTool } from "./HtmlEntityTool";
import { YamlTool } from "./YamlTool";
import { CsvTool } from "./CsvTool";
import { JsonTool } from "./JsonTool";
import { JwtTool } from "./JwtTool";
import { UnixTimeTool } from "./UnixTimeTool";
import { HashTool } from "./HashTool";
import { HmacTool } from "./HmacTool";
import { UuidTool } from "./UuidTool";
import { ImageTool } from "./ImageTool";
import { ColorTool } from "./ColorTool";

const COMPONENTS: Record<string, ComponentType> = {
  diff: DiffTool,
  regex: RegexTool,
  base64: Base64Tool,
  url: UrlTool,
  "html-entity": HtmlEntityTool,
  yaml: YamlTool,
  csv: CsvTool,
  json: JsonTool,
  jwt: JwtTool,
  unixtime: UnixTimeTool,
  hash: HashTool,
  hmac: HmacTool,
  uuid: UuidTool,
  image: ImageTool,
  color: ColorTool,
};

export function ToolView({ slug }: { slug: string }) {
  const meta = TOOL_MAP[slug];
  const Component = COMPONENTS[slug];
  if (!meta || !Component) return null;
  return (
    <div>
      <ToolHeader tool={meta} />
      <Component />
    </div>
  );
}
