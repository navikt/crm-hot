:: Opprett en scratch org
call sfdx force:org:create -f config\project-scratch-def.json --setalias %1 --durationdays %2 --setdefaultusername --json --loglevel fatal  --wait 10

:: Installer crm-platform-base ver. 0.21.0.1
call sfdx force:package:install --package 04t2o000000yPMbAAM -r -k navcrm --wait 10 --publishwait 10

:: Installer crm-platform-access-control ver. 0.24.0.1
call sfdx force:package:install --package 04t2o000000yPWbAAM -r -k navcrm --wait 10 --publishwait 10

:: Installer crm-community-base ver. 0.8.0.7
call sfdx force:package:install --package 04t2o000000OAAaAAO -r -k navcrm --wait 10 --publishwait 10

:: Dytt kildekoden til scratch org'en
call sfdx force:source:push

:: Tildel tilatelsessett til brukeren
call sfdx force:user:permset:assign --permsetname HOT_admin

:: Opprett testdata
call sfdx force:data:tree:import --plan data-source/data-import-plan.json
call sfdx force:apex:execute -f scripts/apex/createTestData.apex
