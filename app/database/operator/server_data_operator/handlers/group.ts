// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {MM_TABLES} from '@constants/database';
import {transformGroupMembershipRecord, transformGroupRecord} from '@database/operator/server_data_operator/transformers/group';
import {getUniqueRawsBy} from '@database/operator/utils/general';

import type {HandleGroupArgs, HandleGroupMembershipArgs} from '@typings/database/database';
import type GroupModel from '@typings/database/models/servers/group';
import type GroupMembershipModel from '@typings/database/models/servers/group_membership';

const {GROUP, GROUP_MEMBERSHIP} = MM_TABLES.SERVER;
export interface GroupHandlerMix {
    handleGroups: ({groups, prepareRecordsOnly}: HandleGroupArgs) => Promise<GroupModel[]>;
    handleGroupMemberships: ({groupMemberships, prepareRecordsOnly}: HandleGroupMembershipArgs) => Promise<GroupMembershipModel[]>;
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
     * handleGroupMemberships: Handler responsible for the Create/Update operations occurring on the GroupMembership table from the 'Server' schema
     * @param {HandleGroupMembershipArgs} groupMembershipsArgs
     * @param {GroupMembership[]} groupMembershipsArgs.groupMemberships
     * @param {boolean} groupMembershipsArgs.prepareRecordsOnly
     * @throws DataOperatorException
     * @returns {Promise<GroupMembershipModel[]>}
     */
    handleGroupMemberships = async ({groupMemberships, prepareRecordsOnly = true}: HandleGroupMembershipArgs): Promise<GroupMembershipModel[]> => {
        if (!groupMemberships?.length) {
            // eslint-disable-next-line no-console
            console.warn(
                'An empty or undefined "groupMemberships" array has been passed to the handleGroupMemberships method',
            );
            return [];
        }

        const createOrUpdateRawValues = getUniqueRawsBy({raws: groupMemberships, key: 'id'});

        return this.handleRecords({
            fieldName: 'id',
            transformer: transformGroupMembershipRecord,
            createOrUpdateRawValues,
            tableName: GROUP_MEMBERSHIP,
            prepareRecordsOnly,
        });
    };
};

export default GroupHandler;
