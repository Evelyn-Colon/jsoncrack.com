import React from "react";
import styled from "styled-components";
import type { CustomNodeProps } from ".";
import useConfig from "../../../../../store/useConfig";
import { isContentImage } from "../lib/utils/calculateNodeSize";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";
import { ActionIcon, TextInput } from "@mantine/core";
import { LuCheck, LuPencil, LuX } from "react-icons/lu";
import useFile from "../../../../../store/useFile";
import { coerceByType, updateNodeContent } from "../../../../../lib/utils/updateNodeValue";

const StyledTextNodeWrapper = styled.span<{ $isParent: boolean }>`
  display: flex;
  justify-content: ${({ $isParent }) => ($isParent ? "center" : "flex-start")};
  align-items: center;
  height: 100%;
  width: 100%;
  overflow: hidden;
  padding: 0 10px;
`;

const StyledImageWrapper = styled.div`
  padding: 5px;
`;

const StyledImage = styled.img`
  border-radius: 2px;
  object-fit: contain;
  background: ${({ theme }) => theme.BACKGROUND_MODIFIER_ACCENT};
`;

const Controls = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  pointer-events: all; /* make controls clickable inside foreignObject */
`;

const Grow = styled.span`
  display: inline-flex;
  align-items: center;
  min-width: 0;
  flex: 1;
  overflow: hidden;
`;

const Node = ({ node, x, y }: CustomNodeProps) => {
  const { text, width, height } = node;
  const imagePreviewEnabled = useConfig(state => state.imagePreviewEnabled);
  const isImage = imagePreviewEnabled && isContentImage(JSON.stringify(text[0].value));
  const value = text[0].value;

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(
    value === null ? "null" : typeof value === "string" ? value : String(value)
  );

  React.useEffect(() => {
    // keep draft in sync if node changes due to external updates
    const next = text[0].value;
    setEditing(false);
    setDraft(next === null ? "null" : typeof next === "string" ? next : String(next));
  }, [node.id, text]);

  const onStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  };

  const onCancel = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const cur = text[0].value;
    setDraft(cur === null ? "null" : typeof cur === "string" ? cur : String(cur));
    setEditing(false);
  };

  const onSave = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const contents = useFile.getState().getContents();
    const format = useFile.getState().getFormat();
    const path = node.path ?? [];
    const nextValue = coerceByType(draft, text[0].type);

    const updated = await updateNodeContent(contents, format, path, nextValue);
    useFile.getState().setContents({ contents: updated });
    setEditing(false);
  };

  return (
    <Styled.StyledForeignObject
      data-id={`node-${node.id}`}
      width={width}
      height={height}
      x={0}
      y={0}
    >
      {isImage ? (
        <StyledImageWrapper>
          <StyledImage src={JSON.stringify(text[0].value)} width="70" height="70" loading="lazy" />
        </StyledImageWrapper>
      ) : (
        <StyledTextNodeWrapper
          data-x={x}
          data-y={y}
          data-key={JSON.stringify(text)}
          $isParent={false}
        >
        <Grow>
            <Styled.StyledKey $value={value} $type={typeof text[0].value}>
              {editing ? (
                <TextInput
                  size="xs"
                  value={draft}
                  onChange={e => setDraft(e.currentTarget.value)}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => {
                    if (e.key === "Enter") onSave();
                    if (e.key === "Escape") onCancel();
                  }}
                  styles={{ input: { pointerEvents: "all" } }}
                />
              ) : (
                <TextRenderer>{value}</TextRenderer>
              )}
            </Styled.StyledKey>
          </Grow>
          <Controls>
            {editing ? (
              <>
                <ActionIcon size="xs" color="green" onClick={onSave}>
                  <LuCheck />
                </ActionIcon>
                <ActionIcon size="xs" color="red" onClick={onCancel}>
                  <LuX />
                </ActionIcon>
              </>
            ) : (
              <ActionIcon size="xs" onClick={onStart}>
                <LuPencil />
              </ActionIcon>
            )}
          </Controls>
        </StyledTextNodeWrapper>
      )}
    </Styled.StyledForeignObject>
  );
};

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  return prev.node.text === next.node.text && prev.node.width === next.node.width;
}

export const TextNode = React.memo(Node, propsAreEqual);
