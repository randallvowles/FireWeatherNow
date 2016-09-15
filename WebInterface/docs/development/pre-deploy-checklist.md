# Pre-deploy checklist
This should serve as a general guideline before pushing updates.

- [ ] All code is style guide compliant (**Need to make this soon**)
- [ ] Remove any CSS/HTML styling

  - Let CSS do all the work

- [ ] Fix obvious speed issues

  - Use variables rather than recalculating the same value
  - Try to avoid loops when a list/dictionary will work

- [ ] Use a config objects

  - Put all configurable parameters in a config block

- [ ] Use human readable variable and method names

- [ ] Properly comment and sign code

  - Use C-Style `/* */` comments for permanent comments
  - Use C++ style `//` for removing code or temporary comments. These will be considered marked for deletion in all stable releases.
  - All file and function headers needs to have `@` tokens for doc stripping
  - __DON'T LEAVE TRAILING `//`!__ These are ignored by JSHint. The only exemption is diagnostic code.

- [ ] Update release notes/change log and any documentation (includes examples for new functions)

- [ ] Push to git repository

  - Rebase fork
  - Commit message should be comprehensive (release notes)
  - Pull request to origin
