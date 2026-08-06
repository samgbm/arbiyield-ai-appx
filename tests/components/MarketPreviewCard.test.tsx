import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarketPreviewCard } from "@/components/markets/MarketPreviewCard";

const sample = {
  title: "Will Brazil win the next World Cup?",
  description:
    "Resolves YES if Brazil is crowned FIFA World Cup champion at the next tournament.",
  category: "Sports",
  endDate: "2030-07-20T23:59:59.000Z",
};

describe("MarketPreviewCard", () => {
  it("renders market preview props", () => {
    render(<MarketPreviewCard {...sample} onDeploy={jest.fn()} />);

    expect(
      screen.getByRole("heading", {
        name: /will brazil win the next world cup\?/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(sample.description)).toBeInTheDocument();
    expect(screen.getByText("Sports")).toBeInTheDocument();
    expect(screen.getByText(sample.endDate)).toBeInTheDocument();
  });

  it("triggers deploy action and shows success toast", async () => {
    const user = userEvent.setup();
    const onDeploy = jest.fn();

    render(<MarketPreviewCard {...sample} onDeploy={onDeploy} />);

    await user.click(
      screen.getByRole("button", { name: /deploy to arbitrum stylus/i }),
    );

    expect(onDeploy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("deploy-toast")).toHaveTextContent(
      "Market Deployment Initiated",
    );
    expect(
      screen.getByRole("button", { name: /deployment initiated/i }),
    ).toBeDisabled();
  });
});
