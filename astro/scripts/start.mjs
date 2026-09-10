process.env.HOST ||= '0.0.0.0';
process.env.PORT ||= '3014';

await import('../dist/server/entry.mjs');
