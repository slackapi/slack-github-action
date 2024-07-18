declare module "markup-js" {
  /**
   * @param template - The string with templated values.
   * @param context - Values to replace in the template.
   * @returns string - The template with replaced context values.
   * @link https://github.com/adammark/Markup.js#usage
   */
  export function up(template: string, context: object): string;
}
