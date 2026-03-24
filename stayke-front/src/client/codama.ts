import { createFromRoot } from "codama";
import { AnchorIdl, rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import idl from "./stayke.json";

export const codama = createFromRoot(rootNodeFromAnchor(idl as AnchorIdl));
export const PROGRAM_ID = "GwRWqCBjW87B74SeHx3sH8w4WVGdbwc6tCKoSsUsLGqW";
