// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {storeGroupMembershipsForMember, storeGroups} from '@actions/local/group';
import {Client} from '@client/rest';
import {getOperator} from '@helpers/database';
import NetworkManager from '@managers/network_manager';
import {prepareGroups} from '@queries/servers/group';

import {forceLogoutIfNecessary} from './session';

export const fetchGroupsForAutocomplete = async (serverUrl: string, query: string, fetchOnly = false) => {
    try {
        const operator = getOperator(serverUrl);
        const client: Client = NetworkManager.getClient(serverUrl);
        const response = await client.getGroups(query);

        // Save locally
        if (!fetchOnly) {
            return await storeGroups(serverUrl, response);
        }

        return await prepareGroups(operator, response);
    } catch (error) {
        forceLogoutIfNecessary(serverUrl, error as ClientErrorProps);
        return {error};
    }
};

export const fetchGroupsByNames = async (serverUrl: string, names: string[], fetchOnly = false) => {
    try {
        const operator = getOperator(serverUrl);

        const client: Client = NetworkManager.getClient(serverUrl);
        const promises: Array <Promise<Group[]>> = [];

        names.forEach((name) => {
            promises.push(client.getGroups(name));
        });

        const groups = (await Promise.all(promises)).flat();

        // Save locally
        if (!fetchOnly) {
            return await storeGroups(serverUrl, groups);
        }

        return await prepareGroups(operator, groups);
    } catch (error) {
        forceLogoutIfNecessary(serverUrl, error as ClientErrorProps);
        return {error};
    }
};

export const fetchGroupsForChannel = async (serverUrl: string, channelId: string, fetchOnly = false) => {
    try {
        const operator = getOperator(serverUrl);
        const client = NetworkManager.getClient(serverUrl);
        const response = await client.getAllGroupsAssociatedToChannel(channelId);

        if (!fetchOnly) {
            return await storeGroups(serverUrl, response.groups);
        }

        return await prepareGroups(operator, response.groups);
    } catch (error) {
        forceLogoutIfNecessary(serverUrl, error as ClientErrorProps);
        return {error};
    }
};

export const fetchGroupsForTeam = async (serverUrl: string, teamId: string, fetchOnly = false) => {
    try {
        const operator = getOperator(serverUrl);
        const client: Client = NetworkManager.getClient(serverUrl);
        const response = await client.getAllGroupsAssociatedToTeam(teamId);

        if (!fetchOnly) {
            return await storeGroups(serverUrl, response.groups);
        }

        return await prepareGroups(operator, response.groups);
    } catch (error) {
        return {error};
    }
};

export const fetchGroupsForMember = async (serverUrl: string, userId: string, fetchOnly = false) => {
    try {
        const client: Client = NetworkManager.getClient(serverUrl);
        const response = await client.getAllGroupsAssociatedToMembership(userId);

        return storeGroupMembershipsForMember(serverUrl, response, userId, fetchOnly);
    } catch (error) {
        return {error};
    }
};

export const fetchFilteredTeamGroups = async (serverUrl: string, searchTerm: string, teamId: string) => {
    try {
        const groups = await fetchGroupsForTeam(serverUrl, teamId);

        if (groups && Array.isArray(groups)) {
            return groups.filter((g) => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        throw groups.error;
    } catch (error) {
        return {error};
    }
};

export const fetchFilteredChannelGroups = async (serverUrl: string, searchTerm: string, channelId: string) => {
    try {
        const groups = await fetchGroupsForChannel(serverUrl, channelId);

        if (groups && Array.isArray(groups)) {
            return groups.filter((g) => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        throw groups.error;
    } catch (error) {
        return {error};
    }
};

