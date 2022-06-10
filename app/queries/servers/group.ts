// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Database, Q} from '@nozbe/watermelondb';

import {MM_TABLES} from '@constants/database';

import type ServerDataOperator from '@database/operator/server_data_operator';
import type GroupModel from '@typings/database/models/servers/group';
import type GroupMembershipModel from '@typings/database/models/servers/group_membership';

const {SERVER: {GROUP, GROUP_MEMBERSHIP, GROUP_CHANNEL, GROUP_TEAM}} = MM_TABLES;

export const queryGroupsByName = (database: Database, name: string) => {
    return database.collections.get<GroupModel>(GROUP).query(
        Q.where('name', Q.like(`%${Q.sanitizeLikeString(name)}%`)),
    );
};

export const queryGroupsByNames = (database: Database, names: string[]) => {
    return database.collections.get<GroupModel>(GROUP).query(
        Q.where('name', Q.oneOf(names)),
    );
};

export const queryGroupsByNameInTeam = (database: Database, name: string, teamId: string) => {
    return database.collections.get<GroupModel>(GROUP).query(
        Q.on(GROUP_TEAM, 'team_id', teamId),
        Q.where('name', Q.like(`%${Q.sanitizeLikeString(name)}%`)),
    );
};

export const queryGroupsByNameInChannel = (database: Database, name: string, channelId: string) => {
    return database.collections.get<GroupModel>(GROUP).query(
        Q.on(GROUP_CHANNEL, 'channel_id', channelId),
        Q.where('name', Q.like(`%${Q.sanitizeLikeString(name)}%`)),
    );
};

export const queryGroupMembershipForUser = (database: Database, userId: string) => {
    return database.collections.get<GroupMembershipModel>(GROUP_MEMBERSHIP).query(
        Q.where('user_id', userId),
    );
};

export const prepareGroups = (operator: ServerDataOperator, groups: Group[]) => {
    return operator.handleGroups({groups, prepareRecordsOnly: true});
};

export const prepareGroupMembershipsForUser = async (operator: ServerDataOperator, groups: Group[] | GroupModel[], userId: string) => {
    const existingGroupMemberships = await queryGroupMembershipForUser(operator.database, userId).fetch();
    existingGroupMemberships.forEach((gm) => gm.prepareDestroyPermanently());

    const groupMembershipMap = groups.map((g) => ({id: `${userId}_${g.id}`, user_id: userId, group_id: g.id}));
    const groupMemberships = await operator.handleGroupMemberships({groupMemberships: groupMembershipMap, prepareRecordsOnly: true});

    return {existingGroupMemberships, groupMemberships};
};
