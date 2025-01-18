#!/bin/bash

# Run your build checks here
npm run lint || exit 0 # Ignore lint errors
npm run type-check || exit 0 # Ignore TypeScript errors

# Exit with 1 if you want the build to proceed
exit 1
