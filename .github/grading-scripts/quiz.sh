#!/bin/bash
#
# param
# $1 - question number

expected=(2 2 3 4 3)
# echo ${#expected[@]}

# check quiz file exists
if [ ! -e quiz.md ]; then
  echo "Error: quiz file missing"
  exit 1
fi

# IFS_backup=$IFS
# IFS=$'\n'
answers=($(grep -e "^Answer:" quiz.md | cut -d ':' -f 2 | tr -d "[:blank:]" | sed 's/.*/"&"/'))
# IFS=$IFS_backup
# echo ${#answers[@]}

if [[ ${#answers[@]} != 5 ]]; then
  echo "Error: wrong number of answers in quiz file"
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
      echo "Question $(( $i+1 )) answered correctly."
      ((score+=1))
    else
      incorrect="$incorrect$(( $i+1 )) "
      echo "Question $(( $i+1 )) incorrect."
    fi
  done
  echo "::set-output name=quiz_score::$score"
  echo "::set-output name=incorrect_answers::$incorrect"
fi
