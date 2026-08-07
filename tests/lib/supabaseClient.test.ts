describe("createSupabaseClient", () => {
  const ORIGINAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ORIGINAL_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ORIGINAL_KEY;
    jest.resetModules();
  });

  it("initializes a client when URL and anon key are present", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    const { createSupabaseClient } = await import("@/lib/supabaseClient");
    const client = createSupabaseClient(
      "https://example.supabase.co",
      "test-anon-key",
    );

    expect(client).toBeDefined();
    expect(typeof client.from).toBe("function");
    // expect(client.supabaseUrl).toBe("https://example.supabase.co");
  });

  it("throws when URL or anon key are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { createSupabaseClient } = await import("@/lib/supabaseClient");

    expect(() => createSupabaseClient("", "key")).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
    expect(() =>
      createSupabaseClient("https://example.supabase.co", "   "),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY/);
    expect(() => createSupabaseClient()).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
  });
});
