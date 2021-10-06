echo "Oppretter scratch org"
call sfdx force:org:create -f config\project-scratch-def.json --setalias %1 --durationdays %2 --setdefaultusername --json --loglevel fatal  --wait 10

echo "Installerer crm-platform-base ver. 0.122"
call sfdx force:package:install --package 04t2o000000yT8KAAU -r -k navcrm --wait 10 --publishwait 10

echo "Installerer crm-platform-integration ver. 0.51"
call sfdx force:package:install --package 04t2o000000ySU0AAM -r -k navcrm --wait 10 --publishwait 10

echo "Installerer crm-platform-access-control ver. 0.68"
call sfdx force:package:install --package 04t2o000000ySEMAA2 -r -k navcrm --wait 10 --publishwait 10

echo "Installerer crm-community-base ver. 0.24"
call sfdx force:package:install --package 04t2o000000yTJ3AAM -r -k navcrm --wait 10 --publishwait 10

echo "Installerer crm-platform-reporting ver. 0.25"
call sfdx force:package:install --package 04t2o000000ySIYAA2 -r -k navcrm --wait 10 --publishwait 10

echo "Dytter kildekoden til scratch org'en"
call sfdx force:source:push

echo "Tildeler tilatelsessett til brukeren"
call sfdx force:user:permset:assign --permsetname HOT_admin

echo "Oppretter testdata"
call sfdx force:apex:execute -f scripts/apex/createTestData.apex

echo "Ferdig"
