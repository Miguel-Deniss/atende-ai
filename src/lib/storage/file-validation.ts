import path from "path";

const signatures: Record<string, (buffer: Buffer) => boolean> = {
  ".jpg": (buffer) => buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  ".jpeg": (buffer) => buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  ".png": (buffer) =>
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  ".gif": (buffer) => ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii")),
  ".webp": (buffer) =>
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP",
  ".pdf": (buffer) => buffer.subarray(0, 5).toString("ascii") === "%PDF-",
  ".docx": (buffer) => buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])),
  ".xlsx": (buffer) => buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])),
  ".doc": (buffer) => buffer.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0])),
  ".xls": (buffer) => buffer.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0])),
  ".txt": (buffer) => !buffer.includes(0),
};

export function hasValidFileSignature(filename: string, buffer: Buffer): boolean {
  const extension = path.extname(filename).toLowerCase();
  const validate = signatures[extension];
  return Boolean(validate && buffer.length > 0 && validate(buffer));
}
