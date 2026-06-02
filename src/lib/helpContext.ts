import { createContext, useContext } from "react";

// Contextual help shown in the right-hand panel when a field is focused/hovered.
export interface FieldHelp {
  title: string;
  body?: string;
  // Optional dotted Helm value path this field maps to.
  path?: string;
}

export const HelpContext = createContext<(help: FieldHelp | null) => void>(
  () => {}
);

export const useSetHelp = () => useContext(HelpContext);
