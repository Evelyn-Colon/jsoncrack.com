import React from "react";
import type { CustomNodeProps } from ".";
import { NODE_DIMENSIONS } from "../../../../../constants/graph";
import type { NodeData } from "../../../../../types/graph";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";
import { ActionIcon, TextInput } from "@mantine/core";
import { LuCheck, LuPencil, LuX } from "react-icons/lu";
import useFile from "../../../../../store/useFile";
import { coerceByType, updateNodeContent } from "../../../../../lib/utils/updateNodeValue";
import styled from "styled-components";

type RowProps = {
  row: NodeData["text"][number];
  x: number;
  y: number;
  index: number;
  basePath: NodeData["path"] | undefined;
};

const RowInner = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

const ValueWrap = styled.span`
  display: inline-flex;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Controls = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  pointer-events: all;
`;

const Row = ({ row, x, y, index, basePath }: RowProps) => {
  const rowPosition = index * NODE_DIMENSIONS.ROW_HEIGHT;
  const isComplex = row.type === "object" || row.type === "array";
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(
    row.value === null ? "null" : typeof row.value === "string" ? row.value : String(row.value)
  );

  React.useEffect(() => {
    setEditing(false);
    setDraft(row.value === null ? "null" : typeof row.value === "string" ? row.value : String(row.value));
  }, [row.key, row.value, row.type]);

  const getRowText = () => {
    if (row.type === "object") return `{${row.childrenCount ?? 0} keys}`;
    if (row.type === "array") return `[${row.childrenCount ?? 0} items]`;
    return row.value;
  };

  const onStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  };

  const onCancel = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditing(false);
    setDraft(row.value === null ? "null" : typeof row.value === "string" ? row.value : String(row.value));
  };

  const onSave = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!basePath || row.key == null) return;

    const contents = useFile.getState().getContents();
    const format = useFile.getState().getFormat();
    const path = [...(basePath ?? []), row.key] as Array<string | number>;
    const nextValue = coerceByType(draft, row.type);

    const updated = await updateNodeContent(contents, format, path, nextValue);
    useFile.getState().setContents({ contents: updated });
    setEditing(false);
  };

   return (
    <Styled.StyledRow
      $value={row.value}
      data-key={`${row.key}: ${row.value}`}
      data-x={x}
      data-y={y + rowPosition}
    >
      <RowInner onClick={e => e.stopPropagation()}>
        <Styled.StyledKey $type="object">{row.key}: </Styled.StyledKey>
        <ValueWrap>
          {editing && !isComplex ? (
            <TextInput
              size="xs"
              value={draft}
              onChange={e => setDraft(e.currentTarget.value)}
              onKeyDown={e => {
                if (e.key === "Enter") onSave();
                if (e.key === "Escape") onCancel();
              }}
              styles={{ input: { pointerEvents: "all" } }}
            />
          ) : (
            <TextRenderer>{getRowText()}</TextRenderer>
          )}
        </ValueWrap>
        {!isComplex && (
          <Controls>
            {editing ? (
              <>
                <ActionIcon size="sm" variant="light" color="green" onClick={onSave} aria-label="Save">
                  <LuCheck />
                </ActionIcon>
                <ActionIcon size="sm" variant="light" color="gray" onClick={onCancel} aria-label="Cancel">
                  <LuX />
                </ActionIcon>
              </>
            ) : (
              <ActionIcon size="sm" variant="light" color="gray" onClick={onStart} aria-label="Edit">
                <LuPencil />
              </ActionIcon>
            )}
          </Controls>
        )}
      </RowInner>
    </Styled.StyledRow>
  );
};

const Node = ({ node, x, y }: CustomNodeProps) => (
  <Styled.StyledForeignObject
    data-id={`node-${node.id}`}
    width={node.width}
    height={node.height}
    x={0}
    y={0}
    $isObject
  >
    {node.text.map((row, index) => (
      <Row key={`${node.id}-${index}`} row={row} x={x} y={y} index={index} basePath={node.path} />
    ))}
  </Styled.StyledForeignObject>
);

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  return (
    JSON.stringify(prev.node.text) === JSON.stringify(next.node.text) &&
    prev.node.width === next.node.width
  );
}

export const ObjectNode = React.memo(Node, propsAreEqual);
