import { act, renderHook } from "@testing-library/react";
import { useDemoStore } from "./useDemoStore";

describe("useDemoStore", () => {
  beforeEach(() => {
    // Reset store + persistence between tests so order never leaks state.
    localStorage.clear();
    act(() => {
      useDemoStore.setState({ isDemoMode: false });
    });
  });

  it("initializes with isDemoMode false", () => {
    const { result } = renderHook(() => useDemoStore());

    expect(result.current.isDemoMode).toBe(false);
  });

  it("toggles isDemoMode on and off", () => {
    const { result } = renderHook(() => useDemoStore());

    act(() => {
      result.current.toggleDemoMode();
    });
    expect(result.current.isDemoMode).toBe(true);

    act(() => {
      result.current.toggleDemoMode();
    });
    expect(result.current.isDemoMode).toBe(false);
  });

  it("setDemoMode sets an explicit boolean", () => {
    const { result } = renderHook(() => useDemoStore());

    act(() => {
      result.current.setDemoMode(true);
    });
    expect(result.current.isDemoMode).toBe(true);

    act(() => {
      result.current.setDemoMode(false);
    });
    expect(result.current.isDemoMode).toBe(false);
  });

  it("persists isDemoMode under arbiyield-demo-storage", () => {
    const { result } = renderHook(() => useDemoStore());

    act(() => {
      result.current.setDemoMode(true);
    });

    const raw = localStorage.getItem("arbiyield-demo-storage");
    expect(raw).toBeTruthy();
    expect(raw).toContain('"isDemoMode":true');
  });
});
