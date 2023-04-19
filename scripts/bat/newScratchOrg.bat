echo "Oppretter scratch org"
call sfdx force:org:create -f config\project-scratch-def.json --setalias %1 --durationdays %2 --setdefaultusername --json --loglevel fatal  --wait 10

echo "Installerer crm-platform-base ver. 0.186"
call sfdx package:install --package 04t7U0000008r7rQAA -r -k %3 --wait 10 --publish-wait 10

echo "Installerer crm-platform-integration ver. 0.98"
call sfdx package:install --package 04t7U0000008rFCQAY -r -k %3 --wait 10 --publish-wait 10

echo "Installerer crm-platform-access-control ver. 0.107"
call sfdx package:install --package 04t7U0000008r15QAA -r -k %3 --wait 10 --publish-wait 10

echo "Installerer crm-community-base ver. 0.85"
call sfdx package:install --package 04t7U0000008rHNQAY -r -k %3 --wait 10 --publish-wait 10

echo "Installerer crm-platform-reporting ver. 0.30"
call sfdx package:install --package 04t7U0000008qnNQAQ -r -k %3 --wait 10 --publish-wait 10

echo "Installer crm-henvendelse-base ver. 0.14"
call sfdx package:install --package 04t7U0000008r4dQAA -r -k %3 --wait 10 --publish-wait 10

echo "Dytter kildekoden til scratch org'en"
call sfdx force:source:push

echo "Tildeler tilatelsessett til brukeren"
call sfdx force:user:permset:assign --perm-set-name "HOT_admin, HOT_Config"

echo "Publish Experience Site"
call sfdx community:publish --name Tolketjenesten

echo "Oppretter testdata"
call sfdx apex run -f scripts/apex/createTestData.apex

echo "Ferdig"
