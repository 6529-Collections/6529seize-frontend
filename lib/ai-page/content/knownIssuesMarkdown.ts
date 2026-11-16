// What nobody has tried yet, from 6529 AI's install guides and their
// "What was tested" notes. Release candidate 1 runs models on the person's
// own computer only and hides the network, so nothing here is about the
// network. en-US only for now; see ops/docs/ai-download-page.md.

export const AI_KNOWN_ISSUES_MARKDOWN = `Each of these can fail in a way nobody has seen yet. If you try one, expect problems.

## Mac

1. It ran only on a cloud Mac: an EC2 Mac with an Apple M2 and macOS 15.8.2. Nobody has tried it on a physical Mac.
2. It is built for macOS 13.3 or later, but nobody has tried it on a macOS before 15.8.

## Windows

3. It ran only on Windows Server 2025, on a computer with no GPU. Nobody has tried it on Windows 10 or 11, or with a GPU.
4. Nobody has clicked through the installer's screens.

## Linux

5. It ran only on Ubuntu 22.04 and 24.04: the CPU packages on x86-64 and 64-bit ARM, and the CUDA \`.deb\` on an NVIDIA GPU. Nobody has tried any package on another distribution, or the CUDA \`.tar.gz\`.
6. Nobody has gone through the install in a terminal and answered its question by hand.
`;
