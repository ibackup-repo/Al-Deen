
import React from "react";

import {
  useNavigation,
  usePreventRemove,
} from "@react-navigation/native";

import {
  Use_Page_Transition,
} from "./Context";

export const Page_Transition_Back_Guard = () => {

  const Navigation = useNavigation<any>();

  const {
    Has_Active_Transition,
    Handle_Back_Transition,
  } = Use_Page_Transition();

  usePreventRemove(
    Has_Active_Transition,
    ({ data }) => {

      Handle_Back_Transition(() => {

        Navigation.dispatch(data.action);

      });

    }
  );

  return null;
};

export default Page_Transition_Back_Guard;
