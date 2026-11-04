// @vitest-environment jsdom
//
// The default value of a Mechanism attribute is JavaScript, so it is edited in Monaco
// rather than a text area; every other attribute type keeps the text area, and any
// attribute with facets keeps the dropdown. Monaco is stubbed with a textarea carrying
// the same value/onChange contract — what is under test is which editor is chosen and
// its binding to selectedObject.default_value, not the editor's internals.
//
// The code editor is React.lazy inside GeneralTabAttribute, so the first render shows
// the Suspense fallback and assertions on the editor await it (findBy, not getBy).
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { Attribute, AttributeType } from "@gds";

vi.mock("@/views/code-editor/monaco-setup", () => ({}));
vi.mock("@monaco-editor/react", () => ({
  default: ({
    value,
    onChange,
    language,
    options,
  }: {
    value: string;
    onChange: (v: string | undefined) => void;
    language: string;
    options?: { ariaLabel?: string };
  }) => (
    <textarea
      data-testid="monaco"
      data-language={language}
      aria-label={options?.ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

import GeneralTabAttribute from "./GeneralTabAttribute";
import { useSelectedObjectStore } from "@/resources/store/selectedObjectStore";
import { MECHANISM_ATTRIBUTE_TYPE_UUID } from "@/constants";

const ANY_TEXT = "^[\\s\\S]*$";

const mechanismType = () =>
  new AttributeType(MECHANISM_ATTRIBUTE_TYPE_UUID, "Mechanism", true, ANY_TEXT);
const stringType = () => new AttributeType("at-string", "String", true, ANY_TEXT);

function select(attributeType: AttributeType, defaultValue: string, facets?: string, uuid = "attr-1") {
  useSelectedObjectStore.setState({
    selectedObject: new Attribute(uuid, "Demo", false, defaultValue, attributeType, undefined, undefined, facets),
    type: "Attribute",
  });
}

const monaco = () => screen.findByTestId("monaco") as Promise<HTMLTextAreaElement>;
const defaultValueOf = () =>
  (useSelectedObjectStore.getState().selectedObject as unknown as Attribute).default_value;

beforeEach(() => {
  useSelectedObjectStore.setState({ selectedObject: null, type: null });
});

afterEach(cleanup);

describe("GeneralTabAttribute — default value of a Mechanism attribute", () => {
  it("edits the default value in a JavaScript Monaco editor, not a text field", async () => {
    select(mechanismType(), "function (expression, instance) {}");
    render(<GeneralTabAttribute />);

    const editor = await monaco();
    expect(editor.value).toBe("function (expression, instance) {}");
    expect(editor.getAttribute("data-language")).toBe("javascript");
    expect(editor.getAttribute("aria-label")).toBe("Default value");
    expect(screen.queryByRole("textbox", { name: "Default value" })).toBe(editor);
  });

  it("commits edits onto selectedObject.default_value", async () => {
    select(mechanismType(), "");
    render(<GeneralTabAttribute />);

    fireEvent.change(await monaco(), { target: { value: "function () { return 1; }" } });

    expect(defaultValueOf()).toBe("function () { return 1; }");
  });

  it("renders an empty buffer when the default value is unset", async () => {
    select(mechanismType(), undefined as unknown as string);
    render(<GeneralTabAttribute />);

    expect((await monaco()).value).toBe("");
  });

  it("still reports a default value that the attribute type's expression refuses", async () => {
    const strict = mechanismType();
    strict.regex_value = "^function";
    select(strict, "not a function");
    render(<GeneralTabAttribute />);

    await monaco();
    expect(
      screen.getByText("The default value must match the regular expression of the attribute type."),
    ).not.toBeNull();
  });

  it("keeps the facet dropdown when the attribute has facets", () => {
    select(mechanismType(), "a", "a|b");
    render(<GeneralTabAttribute />);

    expect(screen.queryByTestId("monaco")).toBeNull();
    expect(screen.getByRole("combobox")).not.toBeNull();
  });

  it("gives each attribute its own editor, so undo cannot cross into another attribute", async () => {
    select(mechanismType(), "function a() {}", undefined, "attr-1");
    render(<GeneralTabAttribute />);
    const first = await monaco();

    act(() => select(mechanismType(), "function b() {}", undefined, "attr-2"));
    const second = await monaco();

    expect(second).not.toBe(first);
    expect(second.value).toBe("function b() {}");
  });
});

describe("GeneralTabAttribute — default value of other attribute types", () => {
  it("keeps the plain multi-line text field", () => {
    select(stringType(), "hello");
    render(<GeneralTabAttribute />);

    expect(screen.queryByTestId("monaco")).toBeNull();
    expect((screen.getByLabelText("Default value") as HTMLTextAreaElement).value).toBe("hello");
  });

  it("switches to the code editor once the type is changed to Mechanism", async () => {
    select(stringType(), "function () {}");
    render(<GeneralTabAttribute />);
    expect(screen.queryByTestId("monaco")).toBeNull();

    act(() => {
      useSelectedObjectStore.getState().updateSelectedField("attribute_type", mechanismType());
    });

    expect((await monaco()).value).toBe("function () {}");
  });
});
