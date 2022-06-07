// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// See LICENSE.txt for license information.

import {MM_TABLES} from '@constants/database';
import {prepareBaseRecord} from '@database/operator/server_data_operator/transformers/index';
import {OperationType} from '@typings/database/enums';

import type {TransformerArgs} from '@typings/database/database';
import type GroupModel from '@typings/database/models/servers/group';
import type GroupTeamModel from '@typings/database/models/servers/group_team';

const {
    GROUP,
    GROUP_TEAM,
} = MM_TABLES.SERVER;

/**
  * transformGroupRecord: Prepares a record of the SERVER database 'Group' table for update or create actions.
  * @param {TransformerArgs} operator
  * @param {Database} operator.database
  * @param {RecordPair} operator.value
  * @returns {Promise<GroupModel>}
  */
export const transformGroupRecord = ({action, database, value}: TransformerArgs): Promise<GroupModel> => {
    const raw = value.raw as Group;
    const record = value.record as GroupModel;
    const isCreateAction = action === OperationType.CREATE;

    // id of group comes from server response
    const fieldsMapper = (group: GroupModel) => {
        group._raw.id = isCreateAction ? (raw?.id ?? group.id) : record.id;
        group.name = raw.name;
        group.displayName = raw.display_name;
        group.source = raw.source;
        group.remoteId = raw.remote_id;
    };

    return prepareBaseRecord({
        action,
        database,
        tableName: GROUP,
        value,
        fieldsMapper,
    }) as Promise<GroupModel>;
};

/**
  * transformGroupTeamRecord: Prepares a record of the SERVER database 'GroupTeam' table for update or create actions.
  * @param {TransformerArgs} operator
  * @param {Database} operator.database
  * @param {RecordPair} operator.value
  * @returns {Promise<GroupTeamModel>}
  */
export const transformGroupTeamRecord = ({action, database, value}: TransformerArgs): Promise<GroupTeamModel> => {
    const raw = value.raw as Pick<GroupTeam, 'group_id' | 'team_id'>;

    // id of group comes from server response
    const fieldsMapper = (model: GroupTeamModel) => {
        model._raw.id = `${raw.group_id}_${raw.team_id}`;
        model.groupId = raw.group_id;
        model.teamId = raw.team_id;
    };

    return prepareBaseRecord({
        action,
        database,
        tableName: GROUP_TEAM,
        value,
        fieldsMapper,
    }) as Promise<GroupTeamModel>;
};
