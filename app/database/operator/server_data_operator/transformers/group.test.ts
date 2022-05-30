// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    transformGroupRecord,
    transformGroupChannelRecord,
    transformGroupTeamRecord,
    transformGroupMembershipRecord,
} from '@database/operator/server_data_operator/transformers/group';
import {createTestConnection} from '@database/operator/utils/create_test_connection';
import {OperationType} from '@typings/database/enums';

describe('*** GROUP Prepare Records Test ***', () => {
    it('=> transformGroupRecord: should return an array of type GroupModel', async () => {
        // expect.assertions(3);

        const database = await createTestConnection({databaseName: 'group_prepare_records', setActive: true});
        expect(database).toBeTruthy();

        const preparedRecords = await transformGroupRecord({
            action: OperationType.CREATE,
            database: database!,
            value: {
                record: undefined,
                raw: {
                    id: 'kow9j1ttnxwig7tnqgebg7dtipno',
                    display_name: 'Test',
                    name: 'recent',
                    source: 'custom',
                    remote_id: 'custom',
                } as Group,
            },
        });

        expect(preparedRecords).toBeTruthy();
        expect(preparedRecords.collection.modelClass.name).toBe('GroupModel');
    });

    it('=> transformGroupChannelRecord: should return an array of type GroupChannelModel', async () => {
        // expect.assertions(3);

        const database = await createTestConnection({databaseName: 'group_prepare_records', setActive: true});
        expect(database).toBeTruthy();

        const preparedRecords = await transformGroupChannelRecord({
            action: OperationType.CREATE,
            database: database!,
            value: {
                record: undefined,
                raw: {
                    group_id: 'kow9j1ttnxwig7tnqgebg7dtipno',
                    channel_id: 'channel_id',
                } as GroupChannel,
            },
        });

        expect(preparedRecords).toBeTruthy();
        expect(preparedRecords.collection.modelClass.name).toBe('GroupChannelModel');
    });

    it('=> transformGroupTeamRecord: should return an array of type GroupTeamModel', async () => {
        // expect.assertions(3);

        const database = await createTestConnection({databaseName: 'group_prepare_records', setActive: true});
        expect(database).toBeTruthy();

        const preparedRecords = await transformGroupTeamRecord({
            action: OperationType.CREATE,
            database: database!,
            value: {
                record: undefined,
                raw: {
                    group_id: 'kow9j1ttnxwig7tnqgebg7dtipno',
                    team_id: 'team_id',
                } as GroupTeam,
            },
        });

        expect(preparedRecords).toBeTruthy();
        expect(preparedRecords.collection.modelClass.name).toBe('GroupTeamModel');
    });

    it('=> transformGroupMembershipRecord: should return an array of type GroupMembershipModel', async () => {
        // expect.assertions(3);

        const database = await createTestConnection({databaseName: 'group_prepare_records', setActive: true});
        expect(database).toBeTruthy();

        const preparedRecords = await transformGroupMembershipRecord({
            action: OperationType.CREATE,
            database: database!,
            value: {
                record: undefined,
                raw: {
                    group_id: 'kow9j1ttnxwig7tnqgebg7dtipno',
                    user_id: 'user_id',
                } as GroupMembership,
            },
        });

        expect(preparedRecords).toBeTruthy();
        expect(preparedRecords.collection.modelClass.name).toBe('GroupMembershipModel');
    });
});
