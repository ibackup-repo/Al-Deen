
type Listener = () => void;
let title = "Settings";
let Show_Back_Button = false;
let Go_Back_Function: (() => void) | null = null;
let Close_Function: (() => void) | null = null;
let Is_Search_Mode = false;
let On_Exit_Search_Function: (() => void) | null = null;
let Search_Query = "";
let Ignore_Sync = false;
type Modal_State = {
  title: string;
  Show_Back_Button: boolean;
  Go_Back: () => void;
  Close_Picker: () => void;
};
let Modal_Stack: Modal_State[] = [];
const Listeners = new Set<Listener>();
const Search_Listeners = new Set<Listener>();
export const Mobile_Settings_Store = {
  getState() {
    return { title, Show_Back_Button, Is_Search_Mode, Ignore_Sync };
  },
  Set_State(
    New_Title: string,
    New_Show_Back: boolean,
    New_Go_Back: () => void,
    New_Close: () => void,
    New_Ignore_Sync?: boolean
  ) {
    title = New_Title;
    Show_Back_Button = New_Show_Back;
    Go_Back_Function = New_Go_Back;
    Close_Function = New_Close;
    if (New_Ignore_Sync !== undefined) Ignore_Sync = New_Ignore_Sync;
    Listeners.forEach(listener => listener());
  },
  Push_Modal(title: string, Show_Back_Button: boolean, onBack: () => void, On_Close: () => void) {
    Modal_Stack.push({
      title: this.getState().title,
      Show_Back_Button: this.getState().Show_Back_Button,
      Go_Back: Go_Back_Function || (() => {}),
      Close_Picker: Close_Function || (() => {}),
    });
    this.Set_State(title, Show_Back_Button, onBack, On_Close, true);
  },
  Pop_Modal() {
    const Previous = Modal_Stack.pop();
    if (Previous) {
      this.Set_State(Previous.title, Previous.Show_Back_Button, Previous.Go_Back, Previous.Close_Picker, false);
    } else {
      this.Set_State("Settings", false, () => {}, () => {}, false);
    }
  },
  Enter_Search_Mode(onExit: () => void) {
    Is_Search_Mode = true;
    On_Exit_Search_Function = onExit;
    Listeners.forEach(listener => listener());
  },
  Exit_Search_Mode() {
    Is_Search_Mode = false;
    On_Exit_Search_Function?.();
    On_Exit_Search_Function = null;
    Search_Query = "";
    Search_Listeners.forEach(l => l());
    Listeners.forEach(listener => listener());
  },
  Set_Search_Query(query: string) {
    Search_Query = query;
    Search_Listeners.forEach(l => l());
  },
  Get_Search_Query() {
    return Search_Query;
  },
  Go_Back() {
    Go_Back_Function?.();
  },
  Close_Picker() {
    Close_Function?.();
  },
  subscribe(listener: Listener) {
    Listeners.add(listener);
    return () => Listeners.delete(listener);
  },
  Subscribe_Search(listener: Listener) {
    Search_Listeners.add(listener);
    return () => Search_Listeners.delete(listener);
  }
};