//sequence002
module.exports = {
  "dryRun": false,
  "branches": [
    "main",
    { name: "staging", channel: "dev", prerelease: "dev" },
  ],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        "changelogFile": "docs/CHANGELOG.md"
      }
    ],
    ["@semantic-release/npm", {
      "npmPublish": false,
    }],
    // "@semantic-release/github",
    [
      "@semantic-release/git",
      {
        "assets": [
          "docs/CHANGELOG.md",
          "package.json",
        ],
        "message": "ci(release): update changelogs for ${nextRelease.version} [skip release][skip ci]"
      }
    ]
  ]
};
