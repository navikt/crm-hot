echo "Oppretter scratch org"
call sf org create scratch --definition-file config\project-scratch-def.json --alias %1 --duration-days %2 --set-default --json --wait 30

echo "Installerer crm-platform-base ver. 0.252"
call sf package install --package 04tKB000000Y7SbYAK --no-prompt --installation-key %3 --wait 30 --publish-wait 30

echo "Installerer crm-shared-flowComponents ver. 0.4"
call sf package install --package 04t7U0000008qz4QAA --no-prompt --installation-key %3 --wait 30 --publish-wait 30

echo "Installer crm-henvendelse-base ver. 0.27"
call sf package install --package 04tKB000000Y77jYAC --no-prompt --installation-key %3 --wait 30 --publish-wait 30

echo "Installerer crm-platform-integration ver. 0.142"
call sf package install --package 04tKB000000Y6CWYA0 --no-prompt --installation-key %3 --wait 30 --publish-wait 30

echo "Installerer crm-platform-access-control ver. 0.150"
call sf package install --package 04tKB000000Y86oYAC --no-prompt --installation-key %3 --wait 30 --publish-wait 30

echo "Installerer crm-community-base ver. 0.119"
call sf package install --package 04tKB000000Y0CZYA0 --no-prompt --installation-key %3 --wait 30 --publish-wait 30

echo "Installerer crm-platform-reporting ver. 0.39"
call sf package install --package 04tKB000000Y5GEYA0 --no-prompt --installation-key %3 --wait 30 --publish-wait 30

echo "Dytter kildekoden til scratch org'en"
call sf project deploy start

echo "Tildeler tilatelsessett til brukeren"
call sf org assign permset --name HOT_Admin
call sf org assign permset --name HOT_Config

echo "Publish Experience Site"
call sf community publish --name Tolketjenesten

echo "Oppretter testdata"
call sf apex run --file scripts/apex/createTestData.apex

echo "Ferdig"
