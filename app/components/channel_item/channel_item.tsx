// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useMemo} from 'react';
import {useIntl} from 'react-intl';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import Badge from '@components/badge';
import ChannelIcon from '@components/channel_icon';
import {General} from '@constants';
import {useTheme} from '@context/theme';
import {useIsTablet} from '@hooks/device';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';
import {getUserIdFromChannelName} from '@utils/user';

import CustomStatus from './custom_status';

import type ChannelModel from '@typings/database/models/servers/channel';
import type MyChannelModel from '@typings/database/models/servers/my_channel';
import type MyChannelSettingsModel from '@typings/database/models/servers/my_channel_settings';

type Props = {
    channel: ChannelModel;
    myChannel: MyChannelModel;
    settings: MyChannelSettingsModel;
    currentUserId: string;
    hasDraft: boolean;
    isActive: boolean;
    isInfo?: boolean;
    membersCount: number;
    onPress: (channelId: string) => void;
    teamDisplayName?: string;
    testID?: string;
    isCategoryMuted: boolean;
}

export const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        minHeight: 40,
        alignItems: 'center',
    },
    infoItem: {
        paddingHorizontal: 0,
    },
    wrapper: {
        flex: 1,
        flexDirection: 'row',
    },
    icon: {
        fontSize: 24,
        lineHeight: 28,
        color: changeOpacity(theme.sidebarText, 0.72),
    },
    text: {
        marginTop: -1,
        color: changeOpacity(theme.sidebarText, 0.72),
        paddingLeft: 12,
        paddingRight: 20,
    },
    highlight: {
        color: theme.sidebarUnreadText,
    },
    textInfo: {
        color: theme.centerChannelColor,
        paddingRight: 20,
    },
    muted: {
        color: changeOpacity(theme.sidebarText, 0.32),
    },
    mutedInfo: {
        color: changeOpacity(theme.centerChannelColor, 0.32),
    },
    badge: {
        borderColor: theme.sidebarBg,
        position: 'relative',
        left: 0,
        top: -2,
        alignSelf: undefined,
    },
    infoBadge: {
        color: theme.buttonColor,
        backgroundColor: theme.buttonBg,
        borderColor: theme.centerChannelBg,
    },
    mutedBadge: {
        opacity: 0.32,
    },
    activeItem: {
        backgroundColor: changeOpacity(theme.sidebarTextActiveColor, 0.1),
        borderLeftColor: theme.sidebarTextActiveBorder,
        borderLeftWidth: 5,
        marginLeft: 0,
        paddingLeft: 14,
    },
    textActive: {
        color: theme.sidebarText,
    },
    teamName: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        paddingLeft: 12,
        marginTop: 4,
        ...typography('Body', 75),
    },
    teamNameMuted: {
        color: changeOpacity(theme.centerChannelColor, 0.32),
    },
    teamNameTablet: {
        marginLeft: -12,
        paddingLeft: 0,
        marginTop: 0,
        paddingBottom: 0,
        top: 5,
    },
}));

export const textStyle = StyleSheet.create({
    bold: typography('Body', 200, 'SemiBold'),
    regular: typography('Body', 200, 'Regular'),
});

const ChannelListItem = ({
    channel, myChannel, settings, currentUserId, hasDraft,
    isCategoryMuted, isActive, isInfo, membersCount,
    onPress, teamDisplayName, testID}: Props) => {
    const {formatMessage} = useIntl();
    const theme = useTheme();
    const isTablet = useIsTablet();
    const styles = getStyleSheet(theme);

    // Make it brighter if it's not muted, and highlighted or has unreads
    const isBolded = myChannel.isUnread || myChannel.mentionsCount > 0;

    const height = useMemo(() => {
        let h = 40;
        if (isInfo) {
            h = (teamDisplayName && !isTablet) ? 58 : 44;
        }
        return h;
    }, [teamDisplayName, isInfo, isTablet]);

    const handleOnPress = useCallback(() => {
        onPress(channel.id);
    }, [channel.id]);

    const isMuted = settings.notifyProps.mark_unread === 'mention' || isCategoryMuted;
    const textStyles = useMemo(() => [
        isBolded ? textStyle.bold : textStyle.regular,
        styles.text,
        isBolded && styles.highlight,
        isActive && isTablet && !isInfo ? styles.textActive : null,
        isInfo ? styles.textInfo : null,
    ], [isBolded, styles, settings.notifyProps.mark_unread, isActive, isInfo]);

    const containerStyle = useMemo(() => [
        styles.container,
        isActive && isTablet && !isInfo && styles.activeItem,
        isInfo && styles.infoItem,
        {minHeight: height},
    ],
    [height, isActive, isTablet, isInfo, styles]);

    if (!myChannel) {
        return null;
    }

    const teammateId = (channel.type === General.DM_CHANNEL) ? getUserIdFromChannelName(currentUserId, channel.name) : undefined;
    const isOwnDirectMessage = (channel.type === General.DM_CHANNEL) && currentUserId === teammateId;

    let displayName = channel.displayName;
    if (isOwnDirectMessage) {
        displayName = formatMessage({id: 'channel_header.directchannel.you', defaultMessage: '{displayName} (you)'}, {displayName});
    }

    return (
        <TouchableOpacity onPress={handleOnPress}>
            <>
                <View
                    style={containerStyle}
                    testID={`${testID}.${channel.name}.collapsed.${!isActive}`}
                >
                    <View style={styles.wrapper}>
                        <ChannelIcon
                            hasDraft={hasDraft}
                            isActive={isInfo ? false : isTablet && isActive}
                            isInfo={isInfo}
                            isUnread={isBolded}
                            isArchived={channel.deleteAt > 0}
                            membersCount={membersCount}
                            name={channel.name}
                            shared={channel.shared}
                            size={24}
                            type={channel.type}
                            isMuted={isMuted}
                        />
                        <View>
                            <Text
                                ellipsizeMode='tail'
                                numberOfLines={1}
                                style={textStyles}
                                testID={`${testID}.${channel.name}.display_name`}
                            >
                                {displayName}
                            </Text>
                            {isInfo && Boolean(teamDisplayName) && !isTablet &&
                            <Text
                                ellipsizeMode='tail'
                                numberOfLines={1}
                                testID={`${testID}.${teamDisplayName}.display_name`}
                                style={[styles.teamName, isMuted && styles.teamNameMuted]}
                            >
                                {teamDisplayName}
                            </Text>
                            }
                        </View>
                        {Boolean(teammateId) &&
                        <CustomStatus
                            isInfo={isInfo}
                            userId={teammateId!}
                        />
                        }
                        {isInfo && Boolean(teamDisplayName) && isTablet &&
                        <Text
                            ellipsizeMode='tail'
                            numberOfLines={1}
                            testID={`${testID}.${teamDisplayName}.display_name`}
                            style={[styles.teamName, styles.teamNameTablet, isMuted && styles.teamNameMuted]}
                        >
                            {teamDisplayName}
                        </Text>
                        }
                    </View>
                    <Badge
                        visible={myChannel.mentionsCount > 0}
                        value={myChannel.mentionsCount}
                        style={[styles.badge, isMuted && styles.mutedBadge, isInfo && styles.infoBadge]}
                    />
                </View>
            </>
        </TouchableOpacity>
    );
};

export default ChannelListItem;
