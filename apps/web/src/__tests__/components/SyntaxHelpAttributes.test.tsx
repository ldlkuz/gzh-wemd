import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SyntaxHelpPopover } from "../../components/Editor/SyntaxHelpPopover";

describe("Markdown 属性语法帮助", () => {
  it("在语法速查中展示局部属性写法", () => {
    render(<SyntaxHelpPopover />);

    fireEvent.click(screen.getByRole("button", { name: "语法帮助" }));

    expect(screen.getByText("{.class #id}")).toBeInTheDocument();
    expect(screen.getByText("块级属性")).toBeInTheDocument();
    expect(screen.getByText("**文字**{.class}")).toBeInTheDocument();
    expect(screen.getByText("行内/图片属性")).toBeInTheDocument();
  });
});
