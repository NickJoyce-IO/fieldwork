/** The GitHub org holding the monorepo and every Project's template repository (ADR-0003). */
export const templateOwner = "fieldwork-learn";

/**
 * The template repository a Project is published to, as `<owner>/<repo>`:
 * `<Track's repositoryPrefix>-<Project name>`, so Projects of the same name
 * in different Tracks can't clash (ADR-0003).
 */
export function templateRepository(repositoryPrefix: string, projectName: string): string {
  return `${templateOwner}/${repositoryPrefix}-${projectName}`;
}

/** The link that creates a Learner's own repository from a Project's template. */
export function useThisTemplateUrl(repositoryPrefix: string, projectName: string): string {
  return `https://github.com/${templateRepository(repositoryPrefix, projectName)}/generate`;
}
