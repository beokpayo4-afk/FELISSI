import { ContentPage } from "@/components/layout/ContentPage";
import { company } from "@/constants/company";

export function AboutPage() {
  return (
    <ContentPage title="About Us">
      <p>
        {company.legalName} is the company that operates this storefront. The
        registered office is at {company.address}.
      </p>
      <p>
        The directors of the company are {company.directors[0]} and{" "}
        {company.directors[1]}. {company.managingDirector} is the Managing
        Director.
      </p>
      <p>
        By board resolution dated {company.boardResolutionDate}, the company
        authorized {company.authorizedSignatory} to act as the authorized
        signatory for GST registration and related GST authorization.
      </p>
      <p>{company.gstinLabel}</p>
    </ContentPage>
  );
}
