// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {MM_TABLES} from '@constants/database';
import {transformGroupRecord, transformGroupTeamRecord} from '@database/operator/server_data_operator/transformers/group';
import {getUniqueRawsBy} from '@database/operator/utils/general';

import type {HandleGroupArgs, HandleGroupTeamArgs} from '@typings/database/database';
import type GroupModel from '@typings/database/models/servers/group';
import type GroupTeamModel from '@typings/database/models/servers/group_team';

const {GROUP, GROUP_TEAM} = MM_TABLES.SERVER;

export interface GroupHandlerMix {
    handleGroups: ({groups, prepareRecordsOnly}: HandleGroupArgs) => Promise<GroupModel[]>;
    handleGroupTeams: ({groupTeams, prepareRecordsOnly}: HandleGroupTeamArgs) => Promise<GroupTeamModel[]>;
}

const GroupHandler = (superclass: any) => class extends superclass implements GroupHandlerMix {
    /**
      * handleGroups: Handler responsible for the Create/Update operations occurring on the Group table from the 'Server' schema
      * @param {HandleGroupArgs} groupsArgs
      * @param {Group[]} groupsArgs.groups
      * @param {boolean} groupsArgs.prepareRecordsOnly
      * @throws DataOperatorException
      * @returns {Promise<GroupModel[]>}
      */
    handleGroups = async ({groups, prepareRecordsOnly = true}: HandleGroupArgs): Promise<GroupModel[]> => {
        if (!groups?.length) {
            // eslint-disable-next-line no-console
            console.warn(
                'An empty or undefined "groups" array has been passed to the handleGroups method',
            );
            return [];
        }

        const createOrUpdateRawValues = getUniqueRawsBy({raws: groups, key: 'id'});

        return this.handleRecords({
            fieldName: 'id',
            transformer: transformGroupRecord,
            createOrUpdateRawValues,
            tableName: GROUP,
            prepareRecordsOnly,
        });
    };

    /**
      * handleGroupTeams: Handler responsible for the Create/Update operations occurring on the GroupTeam table from the 'Server' schema
      * @param {HandleGroupTeamArgs} groupTeamsArgs
      * @param {GroupTeam[]} groupTeamsArgs.groupTeams
      * @param {boolean} groupTeamsArgs.prepareRecordsOnly
      * @throws DataOperatorException
      * @returns {Promise<GroupTeamModel[]>}
      */
    handleGroupTeams = async ({groupTeams, prepareRecordsOnly = true}: HandleGroupTeamArgs): Promise<GroupTeamModel[]> => {
        if (!groupTeams?.length) {
            // eslint-disable-next-line no-console
            console.warn(
                'An empty or undefined "groupTeams" array has been passed to the handleGroupTeams method',
            );
            return [];
        }

        const createOrUpdateRawValues = getUniqueRawsBy({raws: groupTeams, key: 'id'});

        return this.handleRecords({
            fieldName: 'id',
            transformer: transformGroupTeamRecord,
            createOrUpdateRawValues,
            tableName: GROUP_TEAM,
            prepareRecordsOnly,
        });
    };
};

export default GroupHandler;
