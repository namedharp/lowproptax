type Environment = Record<string, string | undefined>;

export function liveModeIsExplicitlyEnabled(
  environment: Environment = process.env,
): boolean {
  return environment.DEMO_MODE === "false";
}
