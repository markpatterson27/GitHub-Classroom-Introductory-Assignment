#!/bin/bash
#
# param
# $1 - question number

expected=(2 2 3 4 3)
# echo ${#expected[@]}

default_branch="${DEFAULT_BRANCH:-main}"

# start step summary if script run without any parameters
[ $# -eq 0 ] && echo "### Quiz results" >> $GITHUB_STEP_SUMMARY

# check quiz file exists
if [ ! -e quiz.md ]; then
  echo "Error: quiz.md file missing"
  [ $# -eq 0 ] && echo ":exclamation::x: Error. <code>quiz.md</code> file missing." >> $GITHUB_STEP_SUMMARY
  # [ $1 ] && echo "" > $GITHUB_STEP_SUMMARY
  exit 1
fi

# check if quiz file changed
if [[ $(git log remotes/origin/feedback..$DEFAULT_BRANCH quiz.md) ]]; then
  [ $# -eq 0 ] && echo "quiz.md file changed"
else
  echo "quiz.md file not changed"
  [ $# -eq 0 ] && echo ":x: <code>quiz.md</code> file not changed. Quiz not attempted" >> $GITHUB_STEP_SUMMARY
  exit 1
fi

# IFS_backup=$IFS
# IFS=$'\n'
answers=($(grep -e "^Answer:" quiz.md | cut -d ':' -f 2 | tr -d "[:blank:]" | sed 's/.*/"&"/'))
# IFS=$IFS_backup
# echo ${#answers[@]}

if [[ ${#answers[@]} != 5 ]]; then
  echo "Error: wrong number of answers in quiz file"
  [ $# -eq 0 ] && echo ":exclamation::x: Error. Wrong number of answers found in <code>quiz.md</code> file." >> $GITHUB_STEP_SUMMARY
  exit 1
fi

score=0
incorrect=''
if [ $1 ]; then
  if [[ $(echo ${answers[$1 - 1]} | xargs) == "${expected[$1 - 1]}"* ]]; then
    echo "Question $1 answered correctly."
    echo "pass"
  else
    echo "Question $1 incorrect."
    exit 1
  fi
else
  for i in "${!expected[@]}"; do
    if [[ $(echo ${answers[$i]} | xargs) == "${expected[$i]}"* ]]; then
      echo "✔️ Question $(( $i+1 )) answered correctly." | tee -a $GITHUB_STEP_SUMMARY
      ((score+=1))
    else
      incorrect="$incorrect$(( $i+1 )) "
      echo "✖️ Question $(( $i+1 )) answer incorrect." | tee -a $GITHUB_STEP_SUMMARY
    fi
  done
  echo "quiz_score=$score" >> $GITHUB_OUTPUT
  echo "incorrect_answers=$incorrect" >> $GITHUB_OUTPUT
fi
