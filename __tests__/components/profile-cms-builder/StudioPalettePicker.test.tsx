import { fireEvent, render, screen } from "@testing-library/react";

import StudioPalettePicker from "@/components/profile-cms-builder/studio/StudioPalettePicker";
import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { CMS_STUDIO_DESIGNS } from "@/lib/profile-cms/studio/presentation";

it.each(CMS_STUDIO_DESIGNS)("offers every named palette for %s", (design) => {
  const choose = jest.fn();
  render(
    <StudioPalettePicker
      design={design}
      selected="seize"
      locale="en-US"
      pending={false}
      onChoose={choose}
    />
  );
  expect(screen.getAllByRole("radio")).toHaveLength(18);
  expect(screen.getByRole("radio", { name: "6529" })).toBeChecked();
  fireEvent.click(screen.getByRole("radio", { name: "Oxblood" }));
  expect(choose).toHaveBeenCalledWith(
    expect.objectContaining({ id: "oxblood" })
  );
});

it.each(SUPPORTED_LOCALES)(
  "has readable labels with %s translations or fallback",
  (locale) => {
    render(
      <StudioPalettePicker
        design="artist-v2"
        selected="carbon"
        locale={locale}
        pending={false}
        onChoose={jest.fn()}
      />
    );
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveAccessibleName();
    }
    expect(screen.getByRole("radio", { name: "Carbon" })).toBeChecked();
    expect(screen.queryByText(/profileCms\.palette\./)).not.toBeInTheDocument();
  }
);
