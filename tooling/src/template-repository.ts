/**
 * The template repository a Project is published to, as `<owner>/<repo>`.
 * Where templates live, and how they are named, is still to be decided (#20):
 * this is the one place to change when it is.
 */
export function templateRepository(projectName: string): string {
  return `NickJoyce-IO/fieldwork-${projectName}`;
}

/** The link that creates a Learner's own repository from a Project's template. */
export function useThisTemplateUrl(projectName: string): string {
  return `https://github.com/${templateRepository(projectName)}/generate`;
}
