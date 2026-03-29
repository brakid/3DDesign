export function parseFilename(filename: string): string {
  return filename
    .replace(/\.(obj|gltf|glb|stl|fbx)$/i, '')
    .replace(/[-_\s]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
}
