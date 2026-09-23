import * as React from "react";

import type { Toast_Action_Element, Toast_Props } from "@Web/Component/UI/Toast";

const Toast_Limit = 1;
const Toast_Remove_Delay = 1000000;

type Toaster_Toast = Toast_Props & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: Toast_Action_Element;
};

const Action_Types = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let Count = 0;

function Generate_ID() {
  Count = (Count + 1) % Number.MAX_SAFE_INTEGER;
  return Count.toString();
}

type Action_Type = typeof Action_Types;

type Action =
  | {
      type: Action_Type["ADD_TOAST"];
      Toast: Toaster_Toast;
    }
  | {
      type: Action_Type["UPDATE_TOAST"];
      Toast: Partial<Toaster_Toast>;
    }
  | {
      type: Action_Type["DISMISS_TOAST"];
      Toast_ID?: Toaster_Toast["id"];
    }
  | {
      type: Action_Type["REMOVE_TOAST"];
      Toast_ID?: Toaster_Toast["id"];
    };

interface State {
  Toasts: Toaster_Toast[];
}

const Toast_Timeouts = new Map<string, ReturnType<typeof setTimeout>>();

const Add_To_Remove_Queue = (Toast_ID: string) => {
  if (Toast_Timeouts.has(Toast_ID)) {
    return;
  }

  const Timeout = setTimeout(() => {
    Toast_Timeouts.delete(Toast_ID);
    Dispatch({
      type: "REMOVE_TOAST",
      Toast_ID: Toast_ID,
    });
  }, Toast_Remove_Delay);

  Toast_Timeouts.set(Toast_ID, Timeout);
};

export const Reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        Toasts: [action.Toast, ...state.Toasts].slice(0, Toast_Limit),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        Toasts: state.Toasts.map((t) => (t.id === action.Toast.id ? { ...t, ...action.Toast } : t)),
      };

    case "DISMISS_TOAST": {
      const { Toast_ID } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (Toast_ID) {
        Add_To_Remove_Queue(Toast_ID);
      } else {
        state.Toasts.forEach((Toast) => {
          Add_To_Remove_Queue(Toast.id);
        });
      }

      return {
        ...state,
        Toasts: state.Toasts.map((t) =>
          t.id === Toast_ID || Toast_ID === undefined
            ? {
                ...t,
                Open: false,
              }
            : t,
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.Toast_ID === undefined) {
        return {
          ...state,
          Toasts: [],
        };
      }
      return {
        ...state,
        Toasts: state.Toasts.filter((t) => t.id !== action.Toast_ID),
      };
  }
};

const Listeners: Array<(state: State) => void> = [];

let Memory_State: State = { Toasts: [] };

function Dispatch(action: Action) {
  Memory_State = Reducer(Memory_State, action);
  Listeners.forEach((listener) => {
    listener(Memory_State);
  });
}

type Toast = Omit<Toaster_Toast, "id">;

function Toast({ ...props }: Toast) {
  const id = Generate_ID();

  const Update = (props: Toaster_Toast) =>
    Dispatch({
      type: "UPDATE_TOAST",
      Toast: { ...props, id },
    });
  const Dismiss = () => Dispatch({ type: "DISMISS_TOAST", Toast_ID: id });

  Dispatch({
    type: "ADD_TOAST",
    Toast: {
      ...props,
      id,
      Open: true,
      On_Open_Change: (Open) => {
        if (!Open) Dismiss();
      },
    },
  });

  return {
    id: id,
    Dismiss,
    Update,
  };
}

function Use_Toast() {
  const [state, Set_State] = React.useState<State>(Memory_State);

  React.useEffect(() => {
    Listeners.push(Set_State);
    return () => {
      const index = Listeners.indexOf(Set_State);
      if (index > -1) {
        Listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    Toast,
    Dismiss: (Toast_ID?: string) => Dispatch({ type: "DISMISS_TOAST", Toast_ID }),
  };
}

export { Use_Toast, Toast };
